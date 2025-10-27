module.exports = function ({ types: t }) {
  return {
    name: 'transform-import-meta-to-object',
    visitor: {
      MetaProperty(path) {
        const { meta, property } = path.node;
        if (meta?.name === 'import' && property?.name === 'meta') {
          const isProd = process.env.NODE_ENV === 'production';
          path.replaceWith(
            t.objectExpression([
              t.objectProperty(
                t.identifier('env'),
                t.objectExpression([
                  t.objectProperty(
                    t.identifier('MODE'),
                    t.stringLiteral(isProd ? 'production' : 'development')
                  ),
                  t.objectProperty(
                    t.identifier('DEV'),
                    t.booleanLiteral(!isProd)
                  ),
                ])
              ),
              t.objectProperty(t.identifier('url'), t.stringLiteral('')),
            ])
          );
        }
      },
    },
  };
};