// /de/favoriten/ — German-locale wrapper around the shared Favourites
// component. Same localStorage-backed favourites list as /favourites,
// /es/favoritos and /fr/favoris, just rendered with German strings and
// locale-aware property URLs (linking to /de/immobilien/<slug>/).
import Favourites from '../favourites';

export default function FavoritenDE() {
  return <Favourites locale="de" />;
}
