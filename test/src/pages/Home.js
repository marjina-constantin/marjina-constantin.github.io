import React, {useEffect, useState} from "react";

const Home = () => {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);

  return (
    <div>
      Homepage content
    </div>
  );
};

export default Home;