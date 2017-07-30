import * as L from 'leaflet';

// [marker icon fix] ::start
// temporary fix for broken leaflet image assets path
// keep this code here while the issue is still unresolved.
// Issue URL: <https://github.com/Leaflet/Leaflet/issues/4968>
import icon from 'leaflet/dist/images/marker-icon.png';
import retinaIcon from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconUrl: icon,
    iconRetinaUrl: retinaIcon,
    shadowUrl: iconShadow
});
// [marker icon fix] ::end

// export all items under L namespace
export default L;


