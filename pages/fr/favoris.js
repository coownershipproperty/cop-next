// /fr/favoris/ — French-locale wrapper around the shared Favourites
// component. Same localStorage-backed favourites list as /favourites and
// /es/favoritos, just rendered with French strings and locale-aware
// property URLs (linking to /fr/proprietes/<slug>/).
import Favourites from '../favourites';

export default function FavorisFR() {
  return <Favourites locale="fr" />;
}
