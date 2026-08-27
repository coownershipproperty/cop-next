// /it/preferiti/ — Italian favourites. Same localStorage-backed list as
// /favourites/, rendered with Italian strings and Italian property URLs.
import Favourites from '../favourites';

export default function PreferitiIT() {
  return <Favourites locale="it" />;
}
