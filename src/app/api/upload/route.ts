import { MAX_FILE_BYTES, parseFile } from "@/lib/parse";
import { buildDocumentContext } from "@/lib/prompt";
import type { UploadResponse } from "@/lib/types";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: "File is too large (max 10 MB)." }, { status: 413 });
  }

  try {
    const pages = await parseFile(file);
    if (pages.every((page) => page.length === 0)) {
      return Response.json(
        { error: "No text found. Scanned/image-only PDFs aren't supported yet." },
        { status: 422 },
      );
    }

    const document = { name: file.name, pageCount: pages.length, pages };
    const { truncated } = buildDocumentContext(document);
    return Response.json({ document, truncated } satisfies UploadResponse);
  } catch (error) {
    console.error("Upload parse failed:", error);
    const message = error instanceof Error ? error.message : "Failed to read file.";
    return Response.json({ error: message }, { status: 400 });
  }
}
