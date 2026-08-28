// /pt/favoritos/ — PT favourites. Same localStorage-backed list
// as /favourites/, rendered with PT strings and PT property URLs.
import Favourites from '../favourites';

export default function FavouritesPT() {
  return <Favourites locale="pt" />;
}
