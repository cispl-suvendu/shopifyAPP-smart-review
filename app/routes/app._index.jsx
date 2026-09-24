import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router"; // Added useLoaderData
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server"; // Import your Prisma database

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  // Fetch reviews immediately when the admin page opens
  const reviews = await prisma.review.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: 'desc' }
  });

  // Return the reviews to the frontend
  return { reviews };
};




export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const { reviews } = useLoaderData(); // Automatically grabs data from the loader

  const createTestReview = () => {
    const data = {
      productId: "gid://shopify/Product/8432803315769",
      customerName: "John Doe",
      rating: 5,
      title: "Great product!",
      body: "Really happy with this product.",
    };

    fetcher.submit(data, {
      method: "POST",
      encType: "application/json",
      action: "/api/reviews",
    });
  };

  const updateReviewStatus = (id, newStatus) => {
    fetcher.submit(
      { id, status: newStatus },
      {
        method: "PATCH",
        encType: "application/json",
        action: "/api/reviews",
      }
    );
  };

  return (
    <s-page title="Smart Reviews Dashboard">
      <s-box padding-block-end="400">
        <s-button onClick={createTestReview}>
          Create Test Review
        </s-button>
      </s-box>

      <s-section>
        <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>Customer Reviews ({reviews.length})</h2>

        {reviews.length === 0 ? (
          <p style={{ color: "var(--p-color-text-subdued)" }}>No reviews found.</p>
        ) : (
          <div style={{ border: "1px solid var(--p-color-border)", borderRadius: "8px", overflow: "hidden" }}>
            {reviews.map((review, index) => (
              <div
                key={review.id}
                style={{
                  padding: "16px",
                  backgroundColor: "var(--p-color-bg-surface)",
                  borderBottom: index !== reviews.length - 1 ? "1px solid var(--p-color-border)" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600" }}>
                    {review.title} <span style={{ color: "#eab308" }}>{'★'.repeat(review.rating)}</span>
                  </h3>
                  <p style={{ margin: "0 0 8px 0", color: "var(--p-color-text)" }}>{review.body}</p>
                  <small style={{ color: "var(--p-color-text-subdued)" }}>
                    By <strong>{review.customerName}</strong> on {new Date(review.createdAt).toLocaleDateString()} | Status: <span style={{ textTransform: "capitalize", fontWeight: "bold" }}>{review.status.toLowerCase()}</span>
                  </small>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {/* Only show Approve if it's not already approved */}
                  {review.status !== "APPROVED" && (
                    <s-button
                      variant="primary"
                      onClick={() => updateReviewStatus(review.id, "APPROVED")}
                    >
                      Approve
                    </s-button>
                  )}

                  {/* Only show Reject if it's not already rejected */}
                  {review.status !== "REJECTED" && (
                    <s-button
                      onClick={() => updateReviewStatus(review.id, "REJECTED")}
                    >
                      Reject
                    </s-button>
                  )}

                  {/* Delete Button */}
                  <s-button
                    tone="critical"
                    variant="plain"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this review?")) {
                        fetcher.submit(
                          { id: review.id },
                          { method: "DELETE", encType: "application/json", action: "/api/reviews" }
                        );
                      }
                    }}
                  >
                    Delete
                  </s-button>
                </div>
              </div>
            ))}
          </div>
        )}
      </s-section>
    </s-page>
  );
}