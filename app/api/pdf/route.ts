import PDFParser from "pdf2json";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "PDF file is required" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return Response.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await new Promise<string>((resolve, reject) => {
      const parser = new PDFParser();

      parser.on("pdfParser_dataError", (error) => {
        if (
          error &&
          typeof error === "object" &&
          "parserError" in error
        ) {
          reject(error.parserError);
        } else {
          reject(error);
        }
      });

      parser.on("pdfParser_dataReady", (pdfData) => {
        let extractedText = "";

        for (const page of pdfData.Pages) {
          for (const textElement of page.Texts) {
            for (const run of textElement.R) {
              extractedText += decodeURIComponent(run.T) + " ";
            }

            extractedText += "\n";
          }

          extractedText += "\n";
        }

        resolve(extractedText);
      });

      parser.parseBuffer(buffer);
    });

    return Response.json({
      message: "PDF text extracted successfully",
      text,
    });
  } catch (error) {
    console.error("PDF EXTRACTION ERROR:", error);

    return Response.json(
      {
        error: "Failed to extract text from PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}