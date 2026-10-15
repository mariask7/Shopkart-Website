import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import ProductDetails from "./ProductDetails";
import Cart from "./Cart";
import AuthPage from "./AuthPage";

const API = import.meta.env.VITE_API_URL || "/api";
const CATALOG_API = "https://dummyjson.com";
const AUTH_TOKEN_KEY = "shopkart_token";
const USD_TO_INR = 83;

function convertCatalogPrices(data) {
  const convertProduct = (product) => ({
    ...product,
    price: Number((product.price * USD_TO_INR).toFixed(2)),
  });

  if (Array.isArray(data.products)) {
    return { ...data, products: data.products.map(convertProduct) };
  }
  return convertProduct(data);
}

async function fetchProducts(path) {
  try {
    const response = await axios.get(`${API}/products${path}`);
    if (!Array.isArray(response.data.products) || response.data.products.length > 0) {
      return response.data;
    }
    console.warn("ShopKart API returned no products; using the online catalog.");
  } catch (error) {
    console.warn("ShopKart API is unavailable; using the online product catalog.", error);
  }

  const response = await axios.get(`${CATALOG_API}/products${path}`);
  return convertCatalogPrices(response.data);
}

function getAuthModeFromPath() {
  if (window.location.pathname === "/login") return "login";
  if (window.location.pathname === "/register") return "register";
  return null;
}

/* =========================================
   SHOPKART CATEGORIES
========================================= */

const SHOPKART_CATEGORIES = [
  "All",
  "Women",
  "Men",
  "Beauty",
  "Fragrances",
  "Shoes",
  "Bags",
  "Jewellery",
  "Watches",
  "Sunglasses",
];

/* =========================================
   API CATEGORY MAPPING
========================================= */

const categoryAPI = {
  Women: [
    "womens-dresses",
    "womens-shoes",
    "womens-bags",
    "womens-jewellery",
    "womens-watches",
  ],
  Men: ["mens-shirts", "mens-shoes", "mens-watches"],
  Beauty: ["beauty"],
  Fragrances: ["fragrances"],
  Shoes: ["mens-shoes", "womens-shoes"],
  Bags: ["womens-bags"],
  Jewellery: ["womens-jewellery"],
  Watches: ["mens-watches", "womens-watches"],
  Sunglasses: ["sunglasses"],
};

const allowedCategories = [
  "beauty",
  "fragrances",
  "mens-shirts",
  "mens-shoes",
  "mens-watches",
  "womens-dresses",
  "womens-shoes",
  "womens-bags",
  "womens-jewellery",
  "womens-watches",
  "sunglasses",
];

/* =========================================
   PROMOTIONAL BANNERS
========================================= */

const banners = [
  {
    tag: "SHOPKART BEAUTY EDIT",
    title: "Glow. Style. Repeat.",
    text: "Discover beauty essentials and trending styles.",
    offer: "UP TO 50% OFF",
    icon: "💄",
  },

  {
    tag: "FASHION FEST",
    title: "Your Style, Your Way",
    text: "Fresh fashion picks for every occasion.",
    offer: "FLAT 30% OFF",
    icon: "👗",
  },

  {
    tag: "TRENDING NOW",
    title: "Upgrade Your Look",
    text: "Shoes, watches, jewellery and more.",
    offer: "BEST DEALS",
    icon: "✨",
  },
];

function App() {
  /* =========================================
     STATES
  ========================================= */

  const [products, setProducts] = useState([]);

  const [allProducts, setAllProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All");

  const [wishlist, setWishlist] = useState([]);

  const [cart, setCart] = useState([]);

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [showCart, setShowCart] =
    useState(false);

  const [banner, setBanner] = useState(0);

  const [user, setUser] = useState(null);

  const [authMode, setAuthMode] = useState(getAuthModeFromPath);

  /* =========================================
     LOAD ALL PRODUCTS
  ========================================= */

  const getAllProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchProducts("?limit=0");

      const filtered = data.products.filter((product) =>
        allowedCategories.includes(product.category)
      );
      setAllProducts(filtered);
      setProducts(filtered);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load ShopKart products."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     INITIAL API CALL
  ========================================= */

  useEffect(() => {
    getAllProducts();
  }, []);

  useEffect(() => {
    const syncAuthPage = () => setAuthMode(getAuthModeFromPath());
    window.addEventListener("popstate", syncAuthPage);
    return () => window.removeEventListener("popstate", syncAuthPage);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;

    axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      setUser(response.data);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }).catch((err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        delete axios.defaults.headers.common.Authorization;
      } else {
        console.error("Unable to restore ShopKart session:", err);
      }
    });
  }, []);

  /* =========================================
     AUTOMATIC BANNER
  ========================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setBanner(
        (previous) =>
          (previous + 1) % banners.length
      );
    }, 5500);

    return () => clearInterval(timer);
  }, []);

  /* =========================================
     FETCH MULTIPLE CATEGORIES
  ========================================= */

  const fetchMultipleCategories = async (
    categories
  ) => {
    const requests = categories.map(
      (apiCategory) =>
        fetchProducts(`/category/${apiCategory}`)
    );

    const responses =
      await Promise.all(requests);

    const combinedProducts =
      responses.flatMap(
        (data) =>
          data.products
      );

    const uniqueProducts =
      Array.from(
        new Map(
          combinedProducts.map(
            (product) => [
              product.id,
              product,
            ]
          )
        ).values()
      );

    return uniqueProducts;
  };

  /* =========================================
     CATEGORY SELECT
  ========================================= */

  const selectCategory = async (name) => {
    setCategory(name);
    setSearch("");
    setError("");

    if (name === "All") {
      setProducts(allProducts);
      return;
    }

    setLoading(true);

    try {
      const categories =
        categoryAPI[name];

      if (!categories) {
        setProducts([]);
        return;
      }

      const result =
        await fetchMultipleCategories(
          categories
        );

      setProducts(result);
    } catch (err) {
      console.error(err);

      setError(
        `Unable to load ${name} products.`
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     SEARCH API
  ========================================= */

  const searchProducts = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      selectCategory(category);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchProducts(
        `/search?q=${encodeURIComponent(value)}`
      );

      let results = data.products.filter((product) =>
        allowedCategories.includes(product.category)
      );

      if (
        category !== "All" &&
        categoryAPI[category]
      ) {
        results = results.filter(
          (product) =>
            categoryAPI[
              category
            ].includes(product.category)
        );
      }

      setProducts(results);
    } catch (err) {
      console.error(err);

      setError(
        "Search failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     PRODUCT DETAILS
  ========================================= */

  const openProduct = async (id) => {
    try {
      let product;
      try {
        const response = await axios.get(`${API}/products/${id}`);
        product = response.data;
      } catch (error) {
        console.warn("ShopKart product API is unavailable; using the online catalog.", error);
        const response = await axios.get(`${CATALOG_API}/products/${id}`);
        product = convertCatalogPrices(response.data);
      }

      setSelectedProduct(product);
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================================
     WISHLIST
  ========================================= */

  const toggleWishlist = (product) => {
    setWishlist((previous) => {
      const exists =
        previous.some(
          (item) =>
            item.id === product.id
        );

      if (exists) {
        return previous.filter(
          (item) =>
            item.id !== product.id
        );
      }

      return [
        ...previous,
        product,
      ];
    });
  };

  /* =========================================
     ADD TO CART
  ========================================= */

  const addToCart = async (product) => {
    try {
      await axios.post(`${API}/carts/add`, {
        userId: 1,
        products: [{ id: product.id, quantity: 1 }],
      });
    } catch (err) {
      console.log("Cart API:", err);
    }

    setCart((previous) => {
      const exists =
        previous.find(
          (item) =>
            item.id === product.id
        );

      if (exists) {
        return previous.map(
          (item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item
        );
      }

      return [
        ...previous,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  /* =========================================
     REMOVE CART ITEM
  ========================================= */

  const removeFromCart = (id) => {
    setCart((previous) =>
      previous.filter(
        (item) =>
          item.id !== id
      )
    );
  };

  /* =========================================
     CHANGE QUANTITY
  ========================================= */

  const changeQuantity = (
    id,
    amount
  ) => {
    setCart((previous) =>
      previous.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  Math.max(
                    1,
                    item.quantity +
                      amount
                  ),
              }
            : item
      )
    );
  };

  /* =========================================
     CART CALCULATIONS
  ========================================= */

  const cartCount =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  const cartTotal =
    cart.reduce(
      (total, item) =>
        total +
        item.price *
          item.quantity,
      0
    );

  const currentBanner =
    banners[banner];

  const handleAuthSuccess = ({ token, user: authenticatedUser }) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(authenticatedUser);
    window.history.pushState({}, "", "/");
    setAuthMode(null);
  };

  const navigateAuth = (mode) => {
    window.history.pushState({}, "", `/${mode}`);
    setAuthMode(mode);
    window.scrollTo(0, 0);
  };

  const closeAuth = () => {
    window.history.pushState({}, "", "/");
    setAuthMode(null);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    delete axios.defaults.headers.common.Authorization;
    setUser(null);
  };

  /* =========================================
     JSX
  ========================================= */

  if (authMode) {
    return (
      <AuthPage
        key={authMode}
        mode={authMode}
        onClose={closeAuth}
        onSuccess={handleAuthSuccess}
        onSwitch={() => navigateAuth(authMode === "login" ? "register" : "login")}
      />
    );
  }

  return (
    <div className="shopkart">

      {/* =========================================
    SHOPKART HEADER
========================================= */}

<header className="shopkart-header">

  {/* TOP HEADER */}
  <div className="header-main">

    <div className="header-inner">

      {/* SHOPKART LOGO */}

      <div
        className="shopkart-brand"
        onClick={() => selectCategory("All")}
      >

        <div className="shopkart-logo">

          {/* LOGO ICON */}

          <div className="logo-icon">
            <span>SK</span>
          </div>

          {/* LOGO TEXT */}

          <div className="logo-content">

            <div className="logo-name">
              Shop<span>Kart</span>
            </div>

            <div className="logo-tagline">
              SHOP • STYLE • SMILE
            </div>

          </div>

        </div>

      </div>


      {/* SEARCH BAR */}

      <div className="shopkart-search">

        <span className="search-symbol">
          🔍
        </span>

        <input
          type="text"
          placeholder="Search for products, brands and more"
          value={search}
          onChange={(e) =>
            searchProducts(e.target.value)
          }
        />

        {search && (

          <button
            className="search-clear"
            onClick={() => {
              setSearch("");
              selectCategory(category);
            }}
          >
            ×
          </button>

        )}

      </div>


      {/* LOGIN */}

      {user ? (
        <button className="login-button" onClick={logout} title="Sign out">
          <span className="login-icon">👤</span>
          <span>{user.name.split(" ")[0]}</span>
          <small>Sign out</small>
        </button>
      ) : (
      <button className="login-button" onClick={() => navigateAuth("login")}>

        <span className="login-icon">
          👤
        </span>

        <span>
          Login
        </span>

        <small>
          ▾
        </small>

      </button>
      )}


      {/* MORE */}

      <button className="header-action more-button">

        <span>
          More
        </span>

        <small>
          ▾
        </small>

      </button>


      {/* CART */}

      <button
        className="cart-button"
        onClick={() => setShowCart(true)}
      >

        <span className="cart-icon">
          🛒
        </span>

        <span>
          Cart
        </span>

        {cartCount > 0 && (

          <b className="cart-badge">
            {cartCount}
          </b>

        )}

      </button>

    </div>

  </div>


  {/* CATEGORY NAVIGATION */}

  <div className="category-bar">

    <div className="category-inner">

      {SHOPKART_CATEGORIES.map(
        (item) => (

          <button
            key={item}
            className={
              category === item
                ? "category-link active"
                : "category-link"
            }
            onClick={() =>
              selectCategory(item)
            }
          >

            {item}

          </button>

        )
      )}

    </div>

  </div>

</header>


      {/* =====================================
          PROMOTIONAL BANNER
      ===================================== */}

      <section className="hero-section">

        <div
          key={banner}
          className="offer-banner"
        >

          <div className="banner-content">

            <small>
              {currentBanner.tag}
            </small>

            <h1>
              {currentBanner.title}
            </h1>

            <p>
              {currentBanner.text}
            </p>

            <strong>
              {currentBanner.offer}
            </strong>

            <button
              onClick={() =>
                selectCategory("All")
              }
            >
              SHOP NOW →
            </button>

          </div>


          <div className="banner-visual">

            <div className="circle-large">

              <span>
                {currentBanner.icon}
              </span>

            </div>

            <div className="floating-offer">
              SPECIAL
              <br />
              DEAL
            </div>

          </div>


          {/* PREVIOUS */}

          <button
            className="banner-arrow left"
            onClick={() =>
              setBanner(
                (banner -
                  1 +
                  banners.length) %
                  banners.length
              )
            }
          >
            ‹
          </button>


          {/* NEXT */}

          <button
            className="banner-arrow right"
            onClick={() =>
              setBanner(
                (banner + 1) %
                  banners.length
              )
            }
          >
            ›
          </button>


          {/* DOTS */}

          <div className="banner-dots">

            {banners.map(
              (_, index) => (
                <button
                  key={index}
                  className={
                    index === banner
                      ? "dot active"
                      : "dot"
                  }
                  onClick={() =>
                    setBanner(index)
                  }
                />
              )
            )}

          </div>

        </div>

      </section>


      {/* =====================================
          SERVICE STRIP
      ===================================== */}

      <section className="service-strip">

        <div>
          <span>🚚</span>

          <section>
            <b>Free Delivery</b>
            <small>
              On selected products
            </small>
          </section>
        </div>

        <div>
          <span>💳</span>

          <section>
            <b>Secure Payments</b>
            <small>
              100% secure checkout
            </small>
          </section>
        </div>

        <div>
          <span>↩️</span>

          <section>
            <b>Easy Returns</b>
            <small>
              Simple return policy
            </small>
          </section>
        </div>

        <div>
          <span>⭐</span>

          <section>
            <b>Top Rated</b>
            <small>
              Quality products
            </small>
          </section>
        </div>

      </section>


      {/* =====================================
          PRODUCT SECTION
      ===================================== */}

      <main className="product-section">

        <div className="section-title">

          <div>

            <h2>
              {search
                ? `Search results for "${search}"`
                : category === "All"
                ? "Trending on ShopKart"
                : `${category} Collection`}
            </h2>

            <p>
              Handpicked products for you
            </p>

          </div>

          <span>
            {products.length} Products
          </span>

        </div>


        {/* LOADING */}

        {loading && (
          <div className="loading-area">

            <div className="spinner-border text-primary" />

            <h5>
              Loading ShopKart...
            </h5>

            <p>
              Fetching products from API
            </p>

          </div>
        )}


        {/* ERROR */}

        {!loading && error && (
          <div className="error-area">

            <div>⚠️</div>

            <h4>
              Oops!
            </h4>

            <p>
              {error}
            </p>

            <button
              onClick={
                getAllProducts
              }
            >
              Try Again
            </button>

          </div>
        )}


        {/* PRODUCTS */}

        {!loading &&
          !error &&
          products.length > 0 && (

            <div className="products-grid">

  {products.map((product) => (

    <div
      key={product.id}
      className="product-grid-item"
    >
      <ProductCard
        product={product}
        liked={wishlist.some(
          (item) => item.id === product.id
        )}
        onWishlist={toggleWishlist}
        onAddToCart={addToCart}
        onViewProduct={openProduct}
      />
    </div>

  ))}

</div>

          )}


        {/* NO RESULTS */}

        {!loading &&
          !error &&
          products.length === 0 && (

            <div className="empty-area">

              <div>🔍</div>

              <h4>
                No products found
              </h4>

              <button
                onClick={() =>
                  selectCategory(
                    "All"
                  )
                }
              >
                View All Products
              </button>

            </div>

          )}

      </main>


      {/* =====================================
          PRODUCT DETAILS
      ===================================== */}

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() =>
            setSelectedProduct(null)
          }
          onAddToCart={
            addToCart
          }
        />
      )}


      {/* =====================================
          CART
      ===================================== */}

      {showCart && (
        <Cart
          cart={cart}
          cartTotal={cartTotal}
          onClose={() =>
            setShowCart(false)
          }
          onRemove={
            removeFromCart
          }
          onQuantityChange={
            changeQuantity
          }
        />
      )}


      {/* =====================================
          FOOTER
      ===================================== */}

      <footer className="shopkart-footer">

        {/* MAIN FOOTER */}

        <div className="footer-main">

          <div className="footer-grid">

            {/* SHOPKART */}

            <div className="footer-column footer-about">

              <div className="footer-logo">
                Shop<span>Kart</span>
              </div>

              <p>
                Your everyday destination for
                fashion, beauty and lifestyle.
              </p>

              <div className="social-icons">

                <button>f</button>
                <button>𝕏</button>
                <button>◎</button>
                <button>▶</button>

              </div>

            </div>


            {/* ABOUT */}

            <div className="footer-column">

              <h6>
                ABOUT SHOPKART
              </h6>

              <button>
                Contact Us
              </button>

              <button>
                About Us
              </button>

              <button>
                Careers
              </button>

              <button>
                ShopKart Stories
              </button>

              <button>
                Press
              </button>

            </div>


            {/* CUSTOMER */}

            <div className="footer-column">

              <h6>
                CUSTOMER CARE
              </h6>

              <button>
                Payments
              </button>

              <button>
                Shipping
              </button>

              <button>
                Cancellation & Returns
              </button>

              <button>
                FAQ
              </button>

              <button>
                Help Center
              </button>

            </div>


            {/* POLICY */}

            <div className="footer-column">

              <h6>
                POLICY
              </h6>

              <button>
                Return Policy
              </button>

              <button>
                Terms Of Use
              </button>

              <button>
                Security
              </button>

              <button>
                Privacy
              </button>

              <button>
                Sitemap
              </button>

            </div>


            {/* CONTACT */}

            <div className="footer-column contact-column">

              <h6>
                CONTACT US
              </h6>

              <p>
                📍 Mumbai, Maharashtra
              </p>

              <p>
                📞 1800-123-4567
              </p>

              <p>
                ✉ support@shopkart.com
              </p>

              <p>
                🕘 24 × 7 Customer Support
              </p>

            </div>

          </div>

        </div>


        {/* BOTTOM */}

        <div className="footer-bottom">
  <div className="footer-copyright">
    © 2026 ShopKart. All rights reserved.
  </div>
</div>

      </footer>

    </div>
  );
}

export default App;