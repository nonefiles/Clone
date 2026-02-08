import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: columns, error } = await supabase
      .from("kanban_columns")
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    if (error) {
      console.error("[KANBAN_COLUMNS_GET]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }

    return NextResponse.json(columns);
  } catch (error) {
    console.error("[KANBAN_COLUMNS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, position } = await req.json();

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const { data: column, error } = await supabase
      .from("kanban_columns")
      .insert([
        {
          title,
          position: position ?? 0,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[KANBAN_COLUMNS_POST]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }

    return NextResponse.json(column);
  } catch (error) {
    console.error("[KANBAN_COLUMNS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, title, position } = await req.json();

    if (!id) {
      return new NextResponse("ID is required", { status: 400 });
    }

    const { data: column, error } = await supabase
      .from("kanban_columns")
      .update({
        title,
        position,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[KANBAN_COLUMNS_PUT]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }

    return NextResponse.json(column);
  } catch (error) {
    console.error("[KANBAN_COLUMNS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("ID is required", { status: 400 });
    }

    // İlk olarak bu kolona ait dokümanların status'ünü null yap
    const { error: updateError } = await supabase
      .from("documents")
      .update({ status: null })
      .eq("status", id) // Burada kolonun title'ı değil ID'si kullanılıyor varsayılmıştır
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[KANBAN_COLUMNS_DELETE_DOCS]", updateError);
      return new NextResponse("Internal Error", { status: 500 });
    }

    const { error } = await supabase
      .from("kanban_columns")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[KANBAN_COLUMNS_DELETE]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[KANBAN_COLUMNS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
