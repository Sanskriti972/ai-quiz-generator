import { getCurrentUser } from "@/lib/get-current-user";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return Response.json(user);
  } catch (error) {
    console.error("ME API ERROR:", error);

    return Response.json(
      { error: "Failed to get current user" },
      { status: 500 }
    );
  }
}