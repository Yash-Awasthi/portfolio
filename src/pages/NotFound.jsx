import { Link } from 'react-router';
import { PAPER } from '../lib/tint';
import { Page } from '../components/Motion';

export default function NotFound() {
  return (
    <Page>
      <section data-wash={PAPER} className="mx-auto flex min-h-[100dvh] max-w-[87.5rem] flex-col justify-center px-4 md:px-8">
        <h1 className="display text-[clamp(3rem,9vw,8rem)]">Nothing here.</h1>
        <Link to="/" className="link-underline mt-8 w-fit text-[1.0625rem]">
          Back to the home page
        </Link>
      </section>
    </Page>
  );
}
