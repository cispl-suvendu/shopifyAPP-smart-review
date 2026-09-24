import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }) {
  // 1. Authenticate the App Proxy request
  const { session } = await authenticate.public.appProxy(request);
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Extract Product ID from the incoming storefront request
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return Response.json({ error: "Missing product ID" }, { status: 400 });
  }

  // 3. Query your local SQLite database using Prisma
  const reviews = await prisma.review.findMany({
    where: { 
      shop: session.shop,
      productId: productId 
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ success: true, reviews });
}


export async function action({ request }) {
  // 1. Only allow POST requests
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // 2. Authenticate the App Proxy request
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Parse and validate incoming form data
  const data = await request.json();

  if (!data.productId || !data.rating) {
    return Response.json(
      { success: false, error: "Product ID and Rating are required." },
      { status: 400 }
    );
  }

  // 4. Persist review to Prisma / SQLite
  const newReview = await prisma.review.create({
    data: {
      shop: session.shop,
      productId: data.productId,
      customerName: data.customerName || "Anonymous",
      rating: Number(data.rating),
      title: data.title || "",
      body: data.body || "",
      status: "PENDING", // Good practice: keep new public reviews pending until approved
    },
  });

  return Response.json({ success: true, review: newReview });
}