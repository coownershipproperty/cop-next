// /sv/favoriter/ — SV favourites. Same localStorage-backed list
// as /favourites/, rendered with SV strings and SV property URLs.
import Favourites from '../favourites';

export default function FavouritesSV() {
  return <Favourites locale="sv" />;
}
