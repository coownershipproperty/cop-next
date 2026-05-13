// /es/favoritos/ — Spanish-locale wrapper around the shared Favourites
// component. Same localStorage-backed favourites list as /favourites and
// /fr/favoris, just rendered with Spanish strings and locale-aware
// property URLs (linking to /es/propiedades/<slug>/).
import Favourites from '../favourites';

export default function FavoritosES() {
  return <Favourites locale="es" />;
}
