// ============================================================
//  Véluno — Razorpay Payment Handler
//  Place this file in your project root (same folder as index.html)
//  and add this to your HTML: <script src="payment.js"></script>
// ============================================================

async function processPayment() {
  // ── 1. Read form fields ──────────────────────────────────
 const name  = document.getElementById("cf-name")?.value?.trim();
const email = document.getElementById("cf-email")?.value?.trim();
const phone = document.getElementById("cf-phone")?.value?.trim();
  if (!name || !email || !phone) {
    showToast("Please fill in all required fields.");
    return;
  }

  // ── 2. Get total amount ──────────────────────────────────
  //  This reads the total from your order summary element.
  //  If it doesn't work, replace with your own cart total variable.
  let totalText = document.querySelector("#checkoutSummary")?.innerText
               || document.querySelector(".order-total")?.innerText
               || "0";
  let cartTotal = parseFloat(totalText.replace(/[^0-9.]/g, "")) || 0;

  // Fallback: if you have a JS variable like `cartTotal` already, use it directly:
  // let cartTotal = window.cartTotal || 699;

  if (cartTotal <= 0) {
    showToast("Could not read cart total. Please try again.");
    return;
  }

  const amountInPaise = Math.round(cartTotal * 100);

  // ── 3. Create Razorpay order via Vercel API ──────────────
  try {
    const res = await fetch("/api/createorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountInPaise, currency: "INR" })
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Order creation error:", err);
      showToast("Could not initiate payment. Please try again.");
      return;
    }

    const order = await res.json();

    // ── 4. Open Razorpay checkout popup ─────────────────────
    const options = {
      key: "rzp_live_STQ1s2SvssyKe4",   // your Razorpay Key ID
      amount: order.amount,
      currency: order.currency,
      name: "Véluno",
      description: "Order Payment",
      order_id: order.id,

      handler: function (response) {
        // ✅ Payment successful
        showToast("Payment successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "/thank-you.html"; // change if needed
        }, 1500);
      },

      prefill: { name, email, contact: phone },
      theme: { color: "#1a1a1a" },

      modal: {
        ondismiss: function () {
          showToast("Payment cancelled.");
        }
      }
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function (response) {
      showToast("Payment failed: " + response.error.description);
      console.error("Payment failed:", response.error);
    });

    rzp.open();

  } catch (err) {
    console.error("Network error:", err);
    showToast("Network error. Check internet and try again.");
  }
}
