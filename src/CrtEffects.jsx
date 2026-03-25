export default function CrtSvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        {/* Subtle chromatic aberration for screen content */}
        <filter
          id="crt-ca"
          filterUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="2000"
          height="2000"
        >
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="r"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="g"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="b"
          />
          <feOffset in="r" dx="-0.5" dy="0" result="r-off" />
          <feOffset in="g" dx="0" dy="0.3" result="g-off" />
          <feOffset in="b" dx="0.5" dy="0" result="b-off" />
          <feMerge>
            <feMergeNode in="r-off" />
            <feMergeNode in="g-off" />
            <feMergeNode in="b-off" />
          </feMerge>
        </filter>

        {/* Wider chromatic aberration for the A-mark logo */}
        <filter
          id="crt-ca-logo"
          filterUnits="userSpaceOnUse"
          x="-10"
          y="-10"
          width="100"
          height="100"
        >
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="r"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="g"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="b"
          />
          <feOffset in="r" dx="-3" dy="0" result="r-off" />
          <feOffset in="g" dx="0" dy="1" result="g-off" />
          <feOffset in="b" dx="3" dy="0" result="b-off" />
          <feMerge>
            <feMergeNode in="r-off" />
            <feMergeNode in="g-off" />
            <feMergeNode in="b-off" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
