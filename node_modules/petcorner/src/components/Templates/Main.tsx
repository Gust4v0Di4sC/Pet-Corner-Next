import './main.css';
import React, { Fragment } from 'react';
import type {ReactNode} from 'react';
import Header from './Header';

type MainProps = {
  icon: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
};

const Main: React.FC<MainProps> = ({ icon, title, subtitle, children }) => {
  return (
    <Fragment>
      <Header icon={icon} title={title} subtitle={subtitle} />
      <main className="content ">
        <div className="p-3 mt-3">{children}</div>
      </main>
    </Fragment>
  );
};

export default Main;
