import { useDispatch, useSelector } from "react-redux";
import Layout from "../../Components/Layout/Layout";
import { Trash } from "lucide-react";
import {
  decrementQuantity,
  deleteFromCart,
  incrementQuantity,
} from "../../redux/cartSlice";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Timestamp, addDoc, collection } from "firebase/firestore";
import { fireDB } from "../../firebase/FirebaseConfig";
import BuyNowModal from "../../Components/buyNowModal/BuyNowModal";
import { Navigate } from "react-router-dom";

const CartPage = () => {
  // Get cart items from Redux store
  const cartItems = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  // Get user info from local storage
  const user = JSON.parse(localStorage.getItem("users"));

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Function to remove an item from the cart
  const deleteCart = (item) => {
    dispatch(deleteFromCart(item));
    toast.success("Item removed from cart");
  };

  // Function to increment item quantity
  const handleIncrement = (id) => {
    dispatch(incrementQuantity(id));
  };

  // Function to decrement item quantity
  const handleDecrement = (id) => {
    dispatch(decrementQuantity(id));
  };

  // Calculate total number of items, defaulting quantity to 1 if undefined
  const cartItemTotal = cartItems
    .map((item) => Number(item.quantity || 1))
    .reduce((prevValue, currValue) => prevValue + currValue, 0);

  // Calculate total price, defaulting price to 0 and quantity to 1 if undefined
  const cartTotal = cartItems
    .map((item) => Number(item.price || 0) * Number(item.quantity || 1))
    .reduce((prevValue, currValue) => prevValue + currValue, 0);

  // Define delivery charge and compute total amount
  const deliveryCharge = 50;
  const totalAmount = cartTotal + deliveryCharge;

  // Sync cart items with local storage on change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // State for address information
  const [addressInfo, setAddressInfo] = useState({
    name: "",
    address: "",
    pincode: "",
    mobileNumber: "",
    time: Timestamp.now().toDate().toISOString(),
    date: new Date().toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
  });

  // Function to handle order placement
  const buyNowFunction = async () => {
    // Validate required fields
    if (
      addressInfo.name === "" ||
      addressInfo.address === "" ||
      addressInfo.pincode === "" ||
      addressInfo.mobileNumber === ""
    ) {
      return toast.error("All fields are required");
    }

    // Validate mobile number (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(addressInfo.mobileNumber)) {
      return toast.error("Please enter a valid mobile number");
    }

    // Prepare order information
    const orderInfo = {
      cartItems,
      addressInfo: {
        ...addressInfo,
        time: Timestamp.now().toDate().toISOString(),
      },
      email: user.email,
      userid: user.uid,
      status: "confirmed",
      time: Timestamp.now().toDate().toISOString(),
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    };

    try {
      // Add order to Firestore
      const orderRef = collection(fireDB, "order");
      await addDoc(orderRef, orderInfo);

      // Reset address info and clear cart
      setAddressInfo({
        name: "",
        address: "",
        pincode: "",
        mobileNumber: "",
        time: Timestamp.now().toDate().toISOString(),
      });
      dispatch(deleteFromCart([])); // Clear cart in Redux state
      toast.success("Order placed successfully");
    } catch (error) {
      console.error("Error placing order: ", error);
      toast.error("Failed to place the order");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 max-w-7xl lg:px-0">
        <div className="mx-auto max-w-2xl py-8 lg:max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Shopping Cart
          </h1>
          <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
            {/* Cart Items Section */}
            <section
              aria-labelledby="cart-heading"
              className="rounded-lg bg-white lg:col-span-8"
            >
              <h2 id="cart-heading" className="sr-only">
                Items in your shopping cart
              </h2>
              <ul role="list" className="divide-y divide-gray-200">
                {cartItems.length > 0 ? (
                  cartItems.map((item, index) => {
                    const { id, title, price, productImageUrl, quantity, category } = item;
                    return (
                      <div key={index} className="">
                        <li className="flex py-6 sm:py-6">
                          <div className="flex-shrink-0">
                            <img
                              src={productImageUrl}
                              alt="Product Image"
                              className="sm:h-38 sm:w-38 h-24 w-24 rounded-md object-contain object-center"
                            />
                          </div>

                          <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                            <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                              <div>
                                <div className="flex justify-between">
                                  <h3 className="text-sm">
                                    <div className="font-semibold text-black">
                                      {title}
                                    </div>
                                  </h3>
                                </div>
                                <div className="mt-1 flex text-sm">
                                  <p className="text-sm text-gray-500">
                                    {category}
                                  </p>
                                </div>
                                <div className="mt-1 flex items-end">
                                  <p className="text-sm font-medium text-gray-900">
                                    ₹{Number(price || 0).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                        <div className="mb-2 flex">
                          <div className="min-w-24 flex">
                            <button
                              onClick={() => handleDecrement(id)}
                              type="button"
                              className="h-7 w-7"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              className="mx-1 h-7 w-9 rounded-md border text-center"
                              value={quantity || 1}
                              readOnly
                            />
                            <button
                              onClick={() => handleIncrement(id)}
                              type="button"
                              className="flex h-7 w-7 items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          <div className="ml-6 flex text-sm">
                            <button
                              onClick={() => deleteCart(item)}
                              type="button"
                              className="flex items-center space-x-1 px-2 py-1 pl-0"
                            >
                              <Trash size={12} className="text-red-500" />
                              <span className="text-xs font-medium text-red-500">
                                Remove
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <h1>No items in the cart</h1>
                )}
              </ul>
            </section>

            {/* Price Summary Section */}
            <section
              aria-labelledby="summary-heading"
              className="mt-16 rounded-md bg-white lg:col-span-4 lg:mt-0 lg:p-0"
            >
              <h2
                id="summary-heading"
                className="border-b border-gray-200 px-4 py-3 text-lg font-medium text-gray-900 sm:p-4"
              >
                Price Details
              </h2>
              <div>
                <dl className="space-y-1 px-2 py-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-800">
                      Price ({cartItemTotal} items)
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      ₹{cartTotal.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <dt className="flex text-sm text-gray-800">
                      <span>Delivery Charges</span>
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      ₹{deliveryCharge.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-y border-dashed py-4">
                    <dt className="text-base font-medium text-gray-900">
                      Total Amount
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
                      ₹{totalAmount.toFixed(2)}
                    </dd>
                  </div>
                </dl>
                <div className="px-2 pb-4 font-medium text-green-700">
                  <div className="flex gap-4 mb-6">
                    <BuyNowModal
                      addressInfo={addressInfo}
                      setAddressInfo={setAddressInfo}
                      buyNowFunction={buyNowFunction}
                    />
                  </div>
                </div>
              </div>
            </section>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;