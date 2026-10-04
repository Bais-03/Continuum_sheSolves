import os
import uuid
from typing import BinaryIO

from fastapi import UploadFile, HTTPException, status

from app.config import settings


class StorageService:

    @staticmethod
    def _get_storage_path(storage_ref: str) -> str:
        # Prevent path traversal
        clean_ref = os.path.basename(storage_ref)
        return os.path.join(settings.STORAGE_DIR, clean_ref)

    @staticmethod
    async def save_upload_file(upload_file: UploadFile) -> str:
        os.makedirs(settings.STORAGE_DIR, exist_ok=True)

        storage_ref = str(uuid.uuid4())
        file_path = StorageService._get_storage_path(storage_ref)

        # --------------------------------------------------------
        # Read file and validate size
        # --------------------------------------------------------
        content = await upload_file.read()

        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"File exceeds maximum upload size of "
                    f"{settings.MAX_UPLOAD_SIZE} bytes"
                ),
            )

        # --------------------------------------------------------
        # Reject empty files
        # --------------------------------------------------------
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File cannot be empty",
            )

        # --------------------------------------------------------
        # Save file
        # --------------------------------------------------------
        with open(file_path, "wb") as f:
            f.write(content)

        return storage_ref

    @staticmethod
    def delete_file(storage_ref: str):
        file_path = StorageService._get_storage_path(storage_ref)

        if os.path.exists(file_path):
            os.remove(file_path)

    @staticmethod
    def get_file_path(storage_ref: str) -> str:
        file_path = StorageService._get_storage_path(storage_ref)

        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found on storage",
            )

        return file_path