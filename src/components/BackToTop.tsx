import { useEffect, useState } from "react";

export default function BackToTop() {
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.scrollingElement?.scrollTop ?? 0;
      const scrollHeight = document.scrollingElement?.scrollHeight ?? 1;
      const clientHeight = document.scrollingElement?.clientHeight ?? 1;
      const p = scrollTop / (scrollHeight - clientHeight) * 100;
      setPercent(Math.floor(p));
      setVisible(p > 1);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      id="back_to_top"
      className={`back-to-top pisces ${visible ? "back-top-active" : ""}`}
      onClick={scrollToTop}
    >
      <i className="fa fa-arrow-up" />
      <span className="scrollpercent">
        <span id="back_to_top_text">{percent}</span>%
      </span>
    </div>
  );
}
