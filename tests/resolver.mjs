export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (e) {
    if (e.code !== 'ERR_MODULE_NOT_FOUND' || !/^\.{1,2}\//.test(specifier)) throw e;
    for (const ext of ['.js', '.jsx']) {
      try { return await next(specifier + ext, context); } catch { /* probar la siguiente */ }
    }
    throw e;
  }
}
