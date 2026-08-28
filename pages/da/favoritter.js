// /da/favoritter/ — DA favourites. Same localStorage-backed list
// as /favourites/, rendered with DA strings and DA property URLs.
import Favourites from '../favourites';

export default function FavouritesDA() {
  return <Favourites locale="da" />;
}
