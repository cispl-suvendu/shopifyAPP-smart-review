import { authenticate } from "../shopify.server";
import prisma from "../db.server"; // Adjust if your template exports 'db' instead of 'prisma'

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const method = request.method;

  // 1. Handle Deleting a Review
  if (method === "DELETE") {
    const data = await request.json();

    if (!data.id) {
      return Response.json(
        { success: false, error: "Review ID is required to delete." },
        { status: 400 }
      );
    }

    // Safety check: ensure the review belongs to this shop before deleting
    await prisma.review.delete({
      where: {
        id: data.id,
        shop: shop,
      },
    });

    return Response.json({ success: true, deletedId: data.id });
  }

  // 2. Handle Creating a Review (POST)
  if (method === "POST") {
    const data = await request.json();

    if (!data.productId || !data.rating) {
      return Response.json(
        { success: false, error: "Product ID and Rating are required." },
        { status: 400 }
      );
    }

    const newReview = await prisma.review.create({
      data: {
        shop: shop,
        productId: data.productId,
        customerName: data.customerName || "Anonymous",
        rating: Number(data.rating),
        title: data.title || "",
        body: data.body || "",
      },
    });

    return Response.json({ success: true, review: newReview });
  }

  // 3. Handle Updating a Review Status (PATCH)
  if (method === "PATCH") {
    const data = await request.json();

    if (!data.id || !data.status) {
      return Response.json(
        { success: false, error: "Review ID and new status are required." },
        { status: 400 }
      );
    }

    // Update the review in the SQLite database
    const updatedReview = await prisma.review.update({
      where: {
        id: data.id,
        shop: shop, // Multi-tenant safety check
      },
      data: {
        status: data.status,
      },
    });

    return Response.json({ success: true, review: updatedReview });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

export async function loader({ request }) {
  // 1. Authenticate the admin request
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // 2. Fetch all reviews for this specific shop using Prisma
  const reviews = await prisma.review.findMany({
    where: {
      shop: shop
    },
    orderBy: {
      createdAt: 'desc' // Returns newest reviews first
    }
  });

  // 3. Return the array of reviews
  return Response.json({ success: true, reviews });
}