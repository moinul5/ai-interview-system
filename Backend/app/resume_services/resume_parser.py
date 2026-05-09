import os
import tempfile

import fitz
from docx import Document

ALLOWED_EXTENSIONS = frozenset({"pdf", "docx"})


class UnsupportedResumeFormat(Exception):
    def __init__(self, extension: str) -> None:
        self.extension = extension
        super().__init__(extension)


async def extract_resume_text(file) -> str:
    if not file.filename or "." not in file.filename:
        raise UnsupportedResumeFormat("")

    file_extension = file.filename.rsplit(".", 1)[-1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise UnsupportedResumeFormat(file_extension)

    temp_file = tempfile.NamedTemporaryFile(
        delete=False, suffix=f".{file_extension}"
    )
    path = temp_file.name
    try:
        content = await file.read()
        temp_file.write(content)
        temp_file.close()

        if file_extension == "pdf":
            text_parts: list[str] = []
            with fitz.open(path) as pdf:
                for page in pdf:
                    text_parts.append(page.get_text())
            return "".join(text_parts)

        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs)

    finally:
        if os.path.exists(path):
            try:
                os.unlink(path)
            except OSError:
                pass
