import React, {useEffect, useState} from "react";

const Home = () => {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);

  return (
    <div>
      Brand new homepage
    </div>
  );
};

export default Home;