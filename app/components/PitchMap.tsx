import { Link } from "react-router";
import { categoryColour } from "~/lib/constants";
import type { MarketDTO, PitchDTO } from "~/lib/types";

interface PitchMapProps {
  market: MarketDTO;
  pitches: PitchDTO[];
  selectedCode: string | null;
  /** Builds the link for a pitch, so the same map works on different pages. */
  hrefFor: (pitch: PitchDTO) => string;
}

export function pitchSummary(pitch: PitchDTO) {
  if (pitch.occupant) return `${pitch.occupant.businessName}, ${pitch.occupant.category}`;
  return pitch.taken ? "Allocated" : "Available";
}

/**
 * The site plan, drawn as SVG from the pitch positions stored in the
 * database. Every pitch is a link, so the map works with a keyboard and
 * without JavaScript.
 */
export function PitchMap({ market, pitches, selectedCode, hrefFor }: PitchMapProps) {
  return (
    <svg
      viewBox="0 0 1000 560"
      role="group"
      aria-label={`Site plan of ${market.name} with ${pitches.length} pitches`}
      className="h-auto w-full rounded-[20px] bg-white"
    >
      <rect x="14" y="14" width="972" height="532" rx="22" fill="#f2f2f7" />
      <text x="500" y="536" textAnchor="middle" fontSize="18" fontWeight="600" fill="#636366">
        Entrance
      </text>
      <path d="M440 546 h120" stroke="#8e8e93" strokeWidth="5" strokeLinecap="round" />

      {pitches.map((pitch) => {
        const selected = pitch.code === selectedCode;
        const fill = pitch.occupant
          ? categoryColour(market.categories, pitch.occupant.category)
          : pitch.taken
            ? "#8e8e93"
            : "#ffffff";
        const textFill = pitch.taken ? "#ffffff" : "#1c1c1e";
        return (
          <Link
            key={pitch.id}
            to={hrefFor(pitch)}
            preventScrollReset
            aria-label={`Pitch ${pitch.code}: ${pitchSummary(pitch)}`}
            aria-current={selected ? "true" : undefined}
          >
            <rect
              x={pitch.x}
              y={pitch.y}
              width={pitch.w}
              height={pitch.h}
              rx="14"
              fill={fill}
              stroke={selected ? "#1c1c1e" : pitch.taken ? fill : "#8e8e93"}
              strokeWidth={selected ? 6 : 2}
              strokeDasharray={pitch.taken || selected ? undefined : "7 5"}
            />
            <text
              x={pitch.x + pitch.w / 2}
              y={pitch.y + pitch.h / 2 + 7}
              textAnchor="middle"
              fontSize="20"
              fontWeight="600"
              fill={textFill}
            >
              {pitch.code}
            </text>
          </Link>
        );
      })}
    </svg>
  );
}

export function MapLegend({ market }: { market: MarketDTO }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.9375rem]">
      {market.categories.map((category) => (
        <li key={category.name} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block size-3.5 rounded-full"
            style={{ background: categoryColour(market.categories, category.name) }}
          />
          {category.name}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block size-3.5 rounded-full bg-[#8e8e93]" />
        Allocated
      </li>
      <li className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block size-3.5 rounded-full border-2 border-dashed border-[#8e8e93] bg-white"
        />
        Available
      </li>
    </ul>
  );
}
