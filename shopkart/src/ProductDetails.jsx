import { useState } from "react";

function ProductDetails({
  product,
  onClose,
  onAddToCart,
}) {
  const [mainImage, setMainImage] =
    useState(product.thumbnail);

  const price = Math.round(product.price);

  const oldPrice = Math.round(
    price /
      (1 - product.discountPercentage / 100)
  );

  return (
    <div className="details-overlay">

      <div className="details-window">

        <button
          className="details-close"
          onClick={onClose}
        >
          ×
        </button>


        <div className="row">

          {/* GALLERY */}

          <div className="col-md-6">

            <div className="product-gallery">

              <div className="thumbnail-column">

                {product.images?.map(
                  (image, index) => (
                    <button
                      key={index}
                      className={
                        mainImage === image
                          ? "product-thumbnail active"
                          : "product-thumbnail"
                      }
                      onClick={() =>
                        setMainImage(image)
                      }
                    >
                      <img
                        src={image}
                        alt=""
                      />
                    </button>
                  )
                )}

              </div>


              <div className="large-product-image">

                <img
                  src={mainImage}
                  alt={product.title}
                />

              </div>

            </div>

          </div>


          {/* INFORMATION */}

          <div className="col-md-6">

            <small className="details-brand">
              {product.brand ||
                product.category}
            </small>

            <h1>
              {product.title}
            </h1>

            {product.rating > 0 && (
              <div className="details-rating">

              <span>
                {product.rating} ★
              </span>

              <small>
                Highly rated product
              </small>

              </div>
            )}

            <hr />

            <div className="details-price">
              ₹{price.toLocaleString("en-IN")}
            </div>

            {product.discountPercentage > 0 && (
              <div className="details-mrp">

              MRP{" "}

              <del>
                ₹
                {oldPrice.toLocaleString(
                  "en-IN"
                )}
              </del>

              <strong>
                {Math.round(
                  product.discountPercentage
                )}
                % OFF
              </strong>

              </div>
            )}


            <div className="offer-box">

              <b>🏷️ Special Offer</b>

              <p>
                Extra benefits available on
                selected products.
              </p>

            </div>


            <h5>
              Product Details
            </h5>

            <p className="details-description">
              {product.description}
            </p>


            <div className="details-features">

              {product.warrantyInformation && (
                <p>✓ {product.warrantyInformation}</p>
              )}

              <p>
                ✓ {product.shippingInformation}
              </p>

              <p>
                ✓ Easy returns
              </p>

              <p>
                ✓ Secure payments
              </p>

            </div>


            <p className="stock-message">
              {product.stock > 0
                ? `✓ In Stock (${product.stock} available)`
                : "Out of Stock"}
            </p>


            <div className="details-buttons">

              <button
                className="details-cart"
                disabled={
                  product.stock <= 0
                }
                onClick={() =>
                  onAddToCart(product)
                }
              >
                🛒 ADD TO CART
              </button>

              <button className="details-buy">
                BUY NOW
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ProductDetails;