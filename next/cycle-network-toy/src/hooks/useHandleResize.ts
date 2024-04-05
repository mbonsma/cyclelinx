import React, { useEffect, useState } from "react";

export default function useHandleResize(
  ref: React.MutableRefObject<HTMLElement | null>
) {
  const [width, setWidth] = useState<number>();

  const handleResize = () => {
    setWidth(ref.current?.clientWidth);
  };

  useEffect(() => {
    let _ref: React.MutableRefObject<HTMLElement | null>;
    if (!width && ref) {
      setWidth(ref.current?.clientWidth);
    }

    if (ref && ref.current) {
      ref.current.addEventListener("resize", handleResize);
      _ref = ref;
    }

    return () => {
      if (_ref) {
        _ref.current?.removeEventListener("resize", handleResize);
      }
    };
  }, [ref]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
  }, []);

  return width;
}
