import React, { useMemo, useState } from 'react';
import { resolveImageUrl } from '../../utils/imageUtils';

const AppImage = ({ src, fallbackSrc, alt, className }) => {
    const resolvedSrc = useMemo(() => resolveImageUrl(src), [src]);
    const [hasError, setHasError] = useState(false);
    const finalSrc = !hasError && resolvedSrc ? resolvedSrc : fallbackSrc;
    return <img src={finalSrc} alt={alt} className={className} onError={() => setHasError(true)} />;
};

export default AppImage;
