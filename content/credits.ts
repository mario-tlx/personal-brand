/**
 * Sources for every image or traced artwork on the site.
 *
 * Rule (CLAUDE.md): art references are Velázquez paintings or Rodin sculptures from
 * public-domain sources only (museum open-access collections or Wikimedia Commons), and
 * each one is recorded here with its source URL and license. Photos of sculptures can carry
 * the photographer's rights even when the sculpture itself is public domain.
 *
 * Status: none yet. The "painting" and "sculpture" drawings in scene 5 are placeholders
 * (an easel and a plinth) until Mario picks the works to trace.
 */

export type Credit = {
  /** Which drawing or image uses it, e.g. "painting". */
  usedFor: string;
  work: string;
  artist: string;
  year: string;
  /** Where the source image was taken from. */
  sourceUrl: string;
  /** License of the source image, as stated on the source page. */
  license: string;
};

export const credits: Credit[] = [];
