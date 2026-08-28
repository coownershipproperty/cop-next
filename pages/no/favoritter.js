// /no/favoritter/ — NO favourites. Same localStorage-backed list
// as /favourites/, rendered with NO strings and NO property URLs.
import Favourites from '../favourites';

export default function FavouritesNO() {
  return <Favourites locale="no" />;
}
