function Cart({
  cart,
  cartTotal,
  onClose,
  onRemove,
  onQuantityChange,
}) {
  return (
    <div className="cart-overlay">

      <div className="cart-panel">

        <div className="cart-title">

          <div>
            <h3>My Cart</h3>

            <small>
              {cart.length} item(s)
            </small>
          </div>

          <button onClick={onClose}>
            ×
          </button>

        </div>


        {cart.length === 0 ? (

          <div className="empty-cart">

            <div>🛒</div>

            <h4>
              Your cart is empty
            </h4>

            <p>
              Add products to your cart
              to see them here.
            </p>

            <button onClick={onClose}>
              CONTINUE SHOPPING
            </button>

          </div>

        ) : (

          <>

            <div className="cart-items">

              {cart.map((item) => (

                <div
                  className="cart-item"
                  key={item.id}
                >

                  <div className="cart-item-image">

                    <img
                      src={item.thumbnail}
                      alt={item.title}
                    />

                  </div>


                  <div className="cart-item-details">

                    <h5>
                      {item.title}
                    </h5>

                    <strong>
                      ₹
                      {Math.round(
                        item.price
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>


                    <div className="quantity-control">

                      <button
                        onClick={() =>
                          onQuantityChange(
                            item.id,
                            -1
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          onQuantityChange(
                            item.id,
                            1
                          )
                        }
                      >
                        +
                      </button>

                    </div>


                    <button
                      className="remove-item"
                      onClick={() =>
                        onRemove(item.id)
                      }
                    >
                      Remove
                    </button>

                  </div>

                </div>

              ))}

            </div>


            <div className="cart-summary">

              <div>
                <span>
                  Total
                </span>

                <strong>
                  ₹
                  {Math.round(
                    cartTotal
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <button>
                PLACE ORDER
              </button>

            </div>

          </>

        )}

      </div>

    </div>
  );
}

export default Cart;