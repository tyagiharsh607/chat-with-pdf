import pandas as pd
from PyPDF2 import PdfReader
import io
from app.supabase_client import supabase
import uuid


def chunk_text(text: str, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks


async def read_file_content(file):
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        reader = PdfReader(file.file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    elif filename.endswith(".txt"):
        content = await file.read()
        return content.decode("utf-8")

    elif filename.endswith(".csv"):
        file.file.seek(0)
        decoded = file.file.read().decode("utf-8")
        df = pd.read_csv(io.StringIO(decoded))
        return _convert_dataframe_to_text(df)

    elif filename.endswith(".xlsx"):
        file.file.seek(0)
        df = pd.read_excel(file.file)
        return _convert_dataframe_to_text(df)
    else:
        raise ValueError("Only PDF, TXT, CSV, and XLSX files are supported.")




async def upload_to_supabase_storage(file, chat_id: str) -> str:
    filename = f"{chat_id}/{uuid.uuid4()}_{file.filename}"
    content = await file.read()

    try:
        supabase.storage.from_("documents").upload(filename, content, file_options={"content-type": file.content_type})
    except Exception as e:
        raise Exception(f"Supabase upload failed: {str(e)}")

    url = supabase.storage.from_("documents").get_public_url(filename)
    return url



def _convert_dataframe_to_text(df: pd.DataFrame):
    rows = []
    for i, row in df.iterrows():
        sentence = ", ".join(f"{col}: {val}" for col, val in row.items())
        rows.append(f"Row {i + 1}: {sentence}")
    return "\n".join(rows)



