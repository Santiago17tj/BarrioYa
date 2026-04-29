/* ==========================================================
   BarrioYa — Checkout JavaScript
   Payment method selection, card formatting, simulated payment
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const paymentMethods = document.querySelectorAll('.payment-method');
  const cardFields = document.getElementById('cardFields');
  const payBtn = document.getElementById('payBtn');
  const checkoutLayout = document.getElementById('checkoutLayout');
  const paymentForm = document.getElementById('paymentForm');
  const checkoutSuccess = document.getElementById('checkoutSuccess');
  const orderSidebar = document.querySelector('.order-sidebar');
  const checkoutHeader = document.querySelector('.checkout-header');

  let selectedMethod = 'nequi';

  // ── Payment Method Selection ──
  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      paymentMethods.forEach(m => m.classList.remove('selected'));
      method.classList.add('selected');
      selectedMethod = method.dataset.method;

      // Show/hide card fields
      if (selectedMethod === 'card') {
        cardFields.classList.add('show');
      } else {
        cardFields.classList.remove('show');
      }
    });
  });

  // ── Card Number Formatting ──
  const cardNumber = document.getElementById('cardNumber');
  if (cardNumber) {
    cardNumber.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = value.substring(0, 19);
    });
  }

  // ── Expiry Formatting ──
  const cardExpiry = document.getElementById('cardExpiry');
  if (cardExpiry) {
    cardExpiry.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });
  }

  // ── Pay Button ──
  payBtn.addEventListener('click', async () => {
    const buyerName = document.getElementById('buyerName').value.trim();
    const buyerPhone = document.getElementById('buyerPhone').value.trim();

    if (!buyerName || !buyerPhone) {
      alert('Por favor completa tu nombre y celular');
      return;
    }

    if (selectedMethod === 'card') {
      const cardNum = cardNumber.value.replace(/\s/g, '');
      const expiry = cardExpiry.value;
      const cvv = document.getElementById('cardCvv').value;

      if (cardNum.length < 13 || !expiry || !cvv) {
        alert('Por favor completa los datos de la tarjeta');
        return;
      }
    }

    // Simulate payment processing
    payBtn.disabled = true;
    payBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
      Procesando pago...
    `;

    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .spin { animation: spin 1s linear infinite; }
    `;
    document.head.appendChild(style);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Show success
    paymentForm.style.display = 'none';
    if (orderSidebar) orderSidebar.style.display = 'none';
    if (checkoutHeader) checkoutHeader.style.display = 'none';
    checkoutSuccess.classList.add('show');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Wompi Integration Ready ──
  // To integrate Wompi:
  // 1. Get your public key from https://comercios.wompi.co
  // 2. Add <script src="https://checkout.wompi.co/widget.js"> to the page
  // 3. Call WidgetCheckout with your configuration:
  //
  // const checkout = new WidgetCheckout({
  //   currency: 'COP',
  //   amountInCents: 1750000, // $17,500 COP
  //   reference: 'BY-2026-0429',
  //   publicKey: 'pub_test_XXXXX',
  //   redirectUrl: 'https://barrioya.com/tracking.html'
  // });
  // checkout.open((result) => {
  //   const transaction = result.transaction;
  //   if (transaction.status === 'APPROVED') { /* success */ }
  // });

  // ── MercadoPago Integration Ready ──
  // To integrate MercadoPago:
  // 1. Get your public key from https://www.mercadopago.com.co/developers
  // 2. Add <script src="https://sdk.mercadopago.com/js/v2">
  // 3. Create preference on backend, then:
  //
  // const mp = new MercadoPago('PUBLIC_KEY');
  // mp.checkout({
  //   preference: { id: 'PREFERENCE_ID_FROM_BACKEND' },
  //   render: { container: '#payment-container', label: 'Pagar' }
  // });

});
