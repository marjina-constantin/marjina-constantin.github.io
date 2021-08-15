import React, {useEffect, useState} from "react";

const Home = () => {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);

  return (
    <div>
      {loading ? <img width="150px" alt="loader" src="https://miro.medium.com/max/1400/1*CsJ05WEGfunYMLGfsT2sXA.gif" /> : 'Homepage content loaded'}
    </div>
  );
};

export default Home;