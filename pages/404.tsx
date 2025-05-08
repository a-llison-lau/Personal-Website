import { NextPage } from "next";
import { useEffect } from "react";

const FourOFour: NextPage<unknown> = () => {
  useEffect(() => {
    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      window.location.href = "https://allison-lau.vercel.app/";
    }, 3000);

    // Cleanup the timer when the component is unmounted
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="grid gap-12">
      <h2 className="text-2xl font-bold">404: Page cannot be found.</h2>
      <p>Redirecting you back to the homepage...</p>
      <p>
        If you're not redirected,{" "}
        <a href="https://allison-lau.vercel.app/">click here</a>.
      </p>
    </section>
  );
};

export default FourOFour;
