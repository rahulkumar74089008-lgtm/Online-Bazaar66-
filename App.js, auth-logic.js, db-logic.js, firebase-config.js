  // Checkout
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(checkoutForm);
      try {
        const order = {
          userId: auth.currentUser ? auth.currentUser.uid : "guest",
          items: JSON.parse(fd.get("items") || "[]"),
          total: parseFloat(fd.get("total") || 0),
          paymentMethod: fd.get("paymentMethod"),
          address: fd.get("address")
        };
        const result = await saveOrder(order);
        if (result.success) {
          alert("Order placed! ID: " + result.orderId);
          checkoutForm.reset();
        } else {
          alert("Error: " + result.error);
        }
      } catch (err) {
        alert("Invalid checkout data format.");
      }
    });
  }

