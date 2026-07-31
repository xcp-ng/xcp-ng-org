import MDXComponents from '@theme-original/MDXComponents';
import Schema from '@site/src/components/Schema';
import Terminal from '@site/src/components/Terminal';
import {CardGrid, LinkCard} from '@site/src/components/Cards';

// Make the shared components available in every .md/.mdx doc without a
// per-file import. Same set/style as the Vates product-docs site.
export default {
  ...MDXComponents,
  Schema,
  Terminal,
  CardGrid,
  LinkCard,
};
