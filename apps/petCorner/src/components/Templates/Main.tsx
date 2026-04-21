import './main.css';
import type { ReactNode } from 'react';
import Header from './Header';

type MainProps = {
  icon: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
  fillHeight?: boolean;
  contentClassName?: string;
};

function Main({
  icon,
  title,
  subtitle,
  children,
  fillHeight = false,
  contentClassName = "",
}: MainProps) {
  const mainClassName = `content${fillHeight ? " content--fill" : ""}`;
  const wrapperClassName = `content__panel ${contentClassName}`.trim();

  return (
    <>
      <Header icon={icon} title={title} subtitle={subtitle} />
      <main className={mainClassName}>
        <div className={wrapperClassName}>{children}</div>
      </main>
    </>
  );
}

export default Main;
