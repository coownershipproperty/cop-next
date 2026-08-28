// /nl/favorieten/ — NL favourites. Same localStorage-backed list
// as /favourites/, rendered with NL strings and NL property URLs.
import Favourites from '../favourites';

export default function FavouritesNL() {
  return <Favourites locale="nl" />;
}
