import md5 from "blueimp-md5"
import Color from "color"
import { nanoid } from "nanoid"
import { FC, useMemo } from "react"

import { encodeAnyAddress } from "../lib/encodeAnyAddress"

const djb2 = (str: string) => {
  let hash = 5381
  for (let i = 0; i < str.length; i++) hash = (hash << 5) + hash + str.charCodeAt(i)
  return hash
}

const valueFromHash = (hash: string, max: number) => {
  return (max + djb2(hash)) % max
}

const colorFromHash = (hash: string) => {
  const hue = valueFromHash(hash, 360)
  return Color.hsv(hue, 100, 100)
}

const rotateText = (text: string, nbChars = 0) => text.slice(nbChars) + text.slice(0, nbChars)

type TalismanOrbProps = { seed: string; width?: number; height?: number; className?: string }

export const useTalismanOrb = (seed: string) => {
  return useMemo(() => {
    const isEthereum = seed?.startsWith("0x")
    try {
      // seed may be specific to a ss58 prefix, get the base address
      // eslint-disable-next-line no-var
      var address = encodeAnyAddress(seed)
    } catch (err) {
      address = seed
    }

    // derive 3 hashs from the seed, used to generate the 3 colors
    const hash1 = md5(address)
    const hash2 = rotateText(hash1, 1)
    const hash3 = rotateText(hash1, 2)

    // the 2 darkest ones will be used as gradient BG
    // the lightest one will be used as gradient circle, to mimic a 3D lighting effect
    const colors = [colorFromHash(hash1), colorFromHash(hash2), colorFromHash(hash3)].sort(
      (c1, c2) => c1.lightness() - c2.lightness()
    )

    // random location in top left corner, avoid beeing to close from the center
    const dotX = 10 + valueFromHash(hash1, 10)
    const dotY = 10 + valueFromHash(hash2, 10)

    // global rotation
    const rotation = valueFromHash(hash1, 360)

    return {
      id: nanoid(), //multiple avatars should cohabit on the same pageaa
      bgColor1: colors[0].hex(),
      bgColor2: colors[1].hex(),
      glowColor: colors[2].hex(),
      transform: `rotate(${rotation} 32 32)`,
      cx: dotX,
      cy: dotY,
      isEthereum,
    }
  }, [seed])
}

export const TalismanOrb: FC<TalismanOrbProps> = ({
  seed,
  width = "1em",
  height = "1em",
  className,
}) => {
  const { id, bgColor1, bgColor2, transform, glowColor, cx, cy, isEthereum } = useTalismanOrb(seed)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 64 64`}
      className={className}
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-bg`}>
          <stop offset="20%" stopColor={bgColor1} />
          <stop offset="100%" stopColor={bgColor2} />
        </linearGradient>
        <radialGradient id={`${id}-circle`}>
          <stop offset="10%" stopColor={glowColor} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <g transform={transform}>
          <rect fill={`url(#${id}-bg)`} x={0} y={0} width={64} height={64} />
          <circle fill={`url(#${id}-circle)`} cx={cx} cy={cy} r={45} opacity={0.7} />
        </g>
        {isEthereum && (
          <g opacity="0.75" transform="scale(0.7) translate(14 14)">
            <path
              d="M12.8101 32.76L32.0001 44.62L51.1901 32.76L32.0001 -0.0699997L12.8101 32.76Z"
              fill="white"
            />
            <path
              d="M12.8101 36.48L32.0001 48.43L51.1901 36.48L32.0001 63.93L12.8101 36.48Z"
              fill="white"
            />
          </g>
        )}
      </g>
    </svg>
  )
}
