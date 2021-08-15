import React, {useEffect, useState} from "react";

const Home = () => {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);

  return (
    <div>
      MISHAAA LUCRAZAAA
    </div>
  );
};

export default Home;