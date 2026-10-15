function ProductCard({
  product,
  liked,
  onWishlist,
  onAddToCart,
  onViewProduct,
}) {
  const rupees = Math.round(product.price);

  const oldPrice = Math.round(
    rupees /
      (1 - product.discountPercentage / 100)
  );

  return (
    <div className="col-6 col-md-4 col-lg-3">

      <div className="shop-product-card">

        {/* WISHLIST */}

        <button
          className={
            liked
              ? "wishlist-btn liked"
              : "wishlist-btn"
          }
          onClick={() =>
            onWishlist(product)
          }
        >
          {liked ? "♥" : "♡"}
        </button>


        {/* IMAGE */}

        <div
          className="card-image-area"
          onClick={() =>
            onViewProduct(product.id)
          }
        >

          <img
            src={product.thumbnail}
            alt={product.title}
          />

          {product.discountPercentage >=
            10 && (
            <span className="sale-label">
              {Math.round(
                product.discountPercentage
              )}
              % OFF
            </span>
          )}

        </div>


        {/* INFORMATION */}

        <div className="card-information">

          <small className="product-brand">
            {product.brand ||
              product.category}
          </small>

          <h3
            onClick={() =>
              onViewProduct(product.id)
            }
          >
            {product.title}
          </h3>


          {product.rating > 0 && (
            <div className="product-rating">

            <span>
              {product.rating} ★
            </span>

            <small>
              {product.reviews?.length || 0}
              + Ratings
            </small>

            </div>
          )}


          <div className="product-price">

            <strong>
              ₹{rupees.toLocaleString("en-IN")}
            </strong>

            {product.discountPercentage > 0 && (
              <>
                <del>
                  ₹{oldPrice.toLocaleString("en-IN")}
                </del>

                <span>
                  {Math.round(product.discountPercentage)}% off
                </span>
              </>
            )}

          </div>


          <div className="delivery-text">
            🚚 Free delivery
          </div>


          <button
            className="card-cart-btn"
            disabled={product.stock <= 0}
            onClick={() =>
              onAddToCart(product)
            }
          >
            ADD TO CART
          </button>

        </div>

      </div>

    </div>
  );
}

export default ProductCard;