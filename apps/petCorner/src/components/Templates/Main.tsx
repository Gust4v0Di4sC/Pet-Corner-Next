import './main.css';
import React, { Fragment } from 'react';
import type {ReactNode} from 'react';
import Header from './Header';

type MainProps = {
  icon: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
  fillHeight?: boolean;
  contentClassName?: string;
};

const Main: React.FC<MainProps> = ({
  icon,
  title,
  subtitle,
  children,
  fillHeight = false,
  contentClassName = "",
}) => {
  const mainClassName = `content${fillHeight ? " content--fill" : ""}`;
  const wrapperClassName = `p-3 mt-3 ${contentClassName}`.trim();

  return (
    <Fragment>
      <Header icon={icon} title={title} subtitle={subtitle} />
      <main className={mainClassName}>
        <div className={wrapperClassName}>{children}</div>
      </main>
    </Fragment>
  );
};

export default Main;
