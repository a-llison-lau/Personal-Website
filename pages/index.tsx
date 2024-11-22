import {NextPage} from 'next';

import About from '../components/About';
import PublicationList from '../components/PublicationList';
import Teaching from '../components/Teaching';
import Education from '../components/Education';


const Index: NextPage<unknown> = () => (
    <>
        <About/>
        <PublicationList/>
        <Education/>
    </>
);

export default Index;
