import Image from 'next/image';

import ExtLink from './ExtLink';
import ProfileImage from './ProfileImage';
import personalInfo from './data/personalInfo.json'

const About = (): JSX.Element => {
	return (
		<section className="grid gap-12" id="about">
			<div className="flex justify-between">
				<div className="mr-8 hidden md:block rounded-md">
					<ProfileImage></ProfileImage>
				</div>
				<div className="flex flex-col max-w-xl w-full justify-evenly">
					<h1 className="text-4xl font-bold pb-8 md:pb-0">{personalInfo.name}</h1>
					<p>
						I am a {personalInfo.about.year} undergrad student
						in computer science and physics at the <ExtLink href= {personalInfo.about.college.link}>{personalInfo.about.college.name} </ExtLink>, where I am currently working under the supervision of Prof. Rahul Krishnan.
						 <br/><a className = "text-sm">✉️ {personalInfo.about.email}</a>
					</p>
					<p className = "text-sm text-gray-600">
						Research Interest: {personalInfo.about.interest}
					</p>
					<p className = "text-sm text-gray-400">
						Under construction......<br/>
					</p>
				</div>
			</div>
		</section>
	);
};

export default About;
