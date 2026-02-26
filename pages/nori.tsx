import fs from 'node:fs';
import path from 'node:path';
import {GetStaticProps, InferGetStaticPropsType, NextPage} from 'next';
import {ReactNode, useMemo, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

type TocItem = {
	id: string;
	title: string;
	features: Array<{
		id: string;
		title: string;
	}>;
};

type NoriProps = {
	introMarkdown: string;
	bodyMarkdown: string;
	toc: TocItem[];
};

const slugify = (value: string): string => value
	.toLowerCase()
	.replace(/`([^`]+)`/g, '$1')
	.replace(/\[(.*?)\]\((.*?)\)/g, '$1')
	.replace(/[^a-z0-9\s-]/g, '')
	.trim()
	.replace(/\s+/g, '-');

const cleanLine = (line: string): string => line.trim();

const fixLatexTextttUnderscore = (line: string): string => line.replace(/\\texttt\{([^}]*)\}/g, (_, textttBody: string) => {
	const escaped = textttBody.replace(/_/g, '\\_');
	return `\\texttt{${escaped}}`;
});

const transformImagePaths = (line: string): string => line
	.replace(/src="(?!https?:\/\/|\/)([^"]+)"/g, (_, src: string) => {
		let normalizedSrc = src.replace(/^\.\//, '');
		normalizedSrc = normalizedSrc.replace(/^(\.\.\/)+/, '');

		const sceneMatch = normalizedSrc.match(/^scenes\/nori-beyond\/([^/]+)\/(.+)$/);
		if (sceneMatch) {
			const map: Record<string, string> = {
				normal_mapping: 'normal-map',
				image_texture: 'image-texture',
				final_gather: 'final-gather',
				caustics_map: 'caustics-map',
				path_ris: 'path-ris',
				directional_light: 'directional-light'
			};
			const folder = map[sceneMatch[1]] ?? sceneMatch[1].replace(/_/g, '-');
			const fileName = sceneMatch[2].split('/').at(-1);
			if (fileName) {
				return `src="/project/${folder}/${fileName}"`;
			}
		}

		return `src="/project/${normalizedSrc}"`;
	});

const removeUnsupportedAssets = (line: string): boolean => {
	const trimmed = cleanLine(line);
	return trimmed.startsWith('<meta')
		|| trimmed.startsWith('<script')
		|| trimmed.startsWith('</script')
		|| trimmed.startsWith('<link')
		|| trimmed.startsWith('<!--');
};

const buildNoriContent = (rawContent: string): {
	introMarkdown: string;
	bodyMarkdown: string;
	toc: TocItem[];
} => {
	const lines = rawContent.split(/\r?\n/);
	let firstContentLineSeen = false;
	let inDetailsBlock = false;
	const toc: TocItem[] = [];
	const allProcessedLines: string[] = [];
	const slugCounts = new Map<string, number>();
	let currentTopLevel: TocItem | null = null;
	let splitIndex = -1;

	const makeId = (title: string): string => {
		const base = slugify(title) || 'section';
		const count = slugCounts.get(base) ?? 0;
		slugCounts.set(base, count + 1);
		return count === 0 ? base : `${base}-${count + 1}`;
	};

	for (const rawLine of lines) {
		if (removeUnsupportedAssets(rawLine)) {
			continue;
		}

		let line = fixLatexTextttUnderscore(transformImagePaths(rawLine));
		const trimmedLine = cleanLine(line);
		if (trimmedLine.startsWith('<details')) {
			inDetailsBlock = true;
		}
		if (inDetailsBlock && line.startsWith('    ')) {
			line = line.slice(4);
		}
		if (trimmedLine === '</details>') {
			inDetailsBlock = false;
		}
		if (!firstContentLineSeen && cleanLine(line)) {
			firstContentLineSeen = true;
			const titleMatch = line.match(/^\*\*(.+)\*\*$/);
			if (titleMatch) {
				line = `# ${titleMatch[1].trim()}`;
			}
		}
		const heading = line.match(/^(#{1,6})\s+(.+)$/);
		if (!heading) {
			allProcessedLines.push(line);
			continue;
		}

		const level = heading[1].length;
		const title = heading[2].trim();
		const id = makeId(title);

		if (level === 1 && title.startsWith('Features --') && splitIndex < 0) {
			splitIndex = allProcessedLines.length;
		}

		if (level === 1 && title !== 'Introduction') {
			currentTopLevel = {id, title, features: []};
			toc.push(currentTopLevel);
		}

		if (level === 2 && currentTopLevel) {
			currentTopLevel.features.push({id, title});
		}

		allProcessedLines.push(line);
	}

	const contentStart = splitIndex >= 0 ? splitIndex : 0;
	const introMarkdown = allProcessedLines.slice(0, contentStart).join('\n');
	const bodyMarkdown = allProcessedLines.slice(contentStart).join('\n');
	return {introMarkdown, bodyMarkdown, toc};
};

export const getStaticProps: GetStaticProps<NoriProps> = async () => {
	const sourcePath = path.join(process.cwd(), 'public', 'project', 'index.html');
	const rawContent = fs.readFileSync(sourcePath, 'utf8');
	const {introMarkdown, bodyMarkdown, toc} = buildNoriContent(rawContent);

	return {
		props: {
			introMarkdown,
			bodyMarkdown,
			toc
		}
	};
};

const markdownPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeRaw, rehypeKatex, rehypeSlug];

const getNodeClassName = (node: any): string => {
	const className = node?.properties?.className;
	if (Array.isArray(className)) {
		return className.join(' ');
	}

	return typeof className === 'string' ? className : '';
};

type CompareImage = {src: string; alt: string};

const splitLabel = (alt: string): string => {
	const normalized = alt.trim();
	if (!normalized) {
		return '';
	}

	const parts = normalized.split(',');
	if (parts.length > 1) {
		return parts[0].trim();
	}

	return normalized;
};

const labelTag = (label: string, className: string): JSX.Element | null => {
	if (!label) {
		return null;
	}

	return <span className={`absolute z-20 px-2 py-1 text-xs font-semibold leading-tight text-white bg-black/65 rounded block ${className}`}>{label}</span>;
};

const TwoWayCompare = ({left, right}: {left: CompareImage; right: CompareImage}): JSX.Element => {
	const [position, setPosition] = useState(50);

	const updatePosition = (clientX: number, element: HTMLDivElement): void => {
		const rect = element.getBoundingClientRect();
		const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
		setPosition(x);
	};

	const leftLabel = splitLabel(left.alt);
	const rightLabel = splitLabel(right.alt);

	return (
		<div
			className="not-prose relative w-full overflow-hidden rounded border border-gray-300 dark:border-gray-700"
			onMouseMove={event => {
				updatePosition(event.clientX, event.currentTarget);
			}}
			onTouchMove={event => {
				const touch = event.touches[0];
				if (touch) {
					updatePosition(touch.clientX, event.currentTarget);
				}
			}}>
			<img src={left.src} alt="" className="w-full h-auto opacity-0 select-none pointer-events-none"/>
			<img src={right.src} alt={right.alt || 'After'} className="absolute inset-0 w-full h-full object-cover"/>
			<img src={left.src} alt={left.alt || 'Before'} className="absolute inset-0 w-full h-full object-cover" style={{clipPath: `inset(0 ${100 - position}% 0 0)`}}/>
			<div className="absolute inset-y-0 w-0.5 bg-white/90 pointer-events-none z-10" style={{left: `${position}%`}}/>
			<div
				className="absolute w-4 h-4 rounded-full border-2 border-white bg-black/40 pointer-events-none z-10"
				style={{left: `calc(${position}% - 8px)`, top: 'calc(50% - 8px)'}}
			/>
			<div className="absolute inset-0 z-20 pointer-events-none">
				{labelTag(leftLabel, 'top-2 left-2')}
				{labelTag(rightLabel, 'top-2 right-2')}
			</div>
		</div>
	);
};

const ThreeWayCompare = ({images}: {images: [CompareImage, CompareImage, CompareImage]}): JSX.Element => {
	const [position, setPosition] = useState(50);
	const band = 14;

	const updatePosition = (clientX: number, element: HTMLDivElement): void => {
		const rect = element.getBoundingClientRect();
		const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
		setPosition(x);
	};

	const leftSplit = Math.min(100, Math.max(0, position - band));
	const rightSplit = Math.min(100, Math.max(0, position + band));

	return (
		<div
			className="not-prose relative w-full overflow-hidden rounded border border-gray-300 dark:border-gray-700"
			onMouseMove={event => {
				updatePosition(event.clientX, event.currentTarget);
			}}
			onTouchMove={event => {
				const touch = event.touches[0];
				if (touch) {
					updatePosition(touch.clientX, event.currentTarget);
				}
			}}>
			<img src={images[0].src} alt="" className="w-full h-auto opacity-0 select-none pointer-events-none"/>
			<img src={images[2].src} alt={images[2].alt || 'Right'} className="absolute inset-0 w-full h-full object-cover"/>
			<img src={images[1].src} alt={images[1].alt || 'Middle'} className="absolute inset-0 w-full h-full object-cover" style={{clipPath: `inset(0 ${100 - rightSplit}% 0 ${leftSplit}%)`}}/>
			<img src={images[0].src} alt={images[0].alt || 'Left'} className="absolute inset-0 w-full h-full object-cover" style={{clipPath: `inset(0 ${100 - leftSplit}% 0 0)`}}/>

			<div className="absolute inset-y-0 w-0.5 bg-white/90 pointer-events-none z-10" style={{left: `${leftSplit}%`}}/>
			<div className="absolute inset-y-0 w-0.5 bg-white/90 pointer-events-none z-10" style={{left: `${rightSplit}%`}}/>
			<div
				className="absolute w-4 h-4 rounded-full border-2 border-white bg-black/40 pointer-events-none z-10"
				style={{left: `calc(${position}% - 8px)`, top: 'calc(50% - 8px)'}}
			/>
			<div className="absolute inset-0 z-20 pointer-events-none">
				{labelTag(splitLabel(images[0].alt), 'top-2 left-2')}
				{labelTag(splitLabel(images[1].alt), 'top-2 left-1/2 -translate-x-1/2')}
				{labelTag(splitLabel(images[2].alt), 'top-2 right-2')}
			</div>
		</div>
	);
};

const FourWayCompare = ({images}: {images: [CompareImage, CompareImage, CompareImage, CompareImage]}): JSX.Element => {
	const [position, setPosition] = useState({x: 50, y: 50});

	const updatePosition = (clientX: number, clientY: number, element: HTMLDivElement): void => {
		const rect = element.getBoundingClientRect();
		const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
		const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
		setPosition({x, y});
	};

	const clipStyles = useMemo(() => ({
		topLeft: {clipPath: `inset(0 ${100 - position.x}% ${100 - position.y}% 0)`},
		topRight: {clipPath: `inset(0 0 ${100 - position.y}% ${position.x}%)`},
		bottomLeft: {clipPath: `inset(${position.y}% ${100 - position.x}% 0 0)`},
		bottomRight: {clipPath: `inset(${position.y}% 0 0 ${position.x}%)`}
	}), [position.x, position.y]);

	return (
		<div
			className="not-prose relative w-full overflow-hidden rounded border border-gray-300 dark:border-gray-700"
			onMouseMove={event => {
				updatePosition(event.clientX, event.clientY, event.currentTarget);
			}}
			onTouchMove={event => {
				const touch = event.touches[0];
				if (touch) {
					updatePosition(touch.clientX, touch.clientY, event.currentTarget);
				}
			}}>
			<img src={images[0].src} alt="" className="w-full h-auto opacity-0 select-none pointer-events-none"/>
			<img src={images[0].src} alt={images[0].alt || 'Top-left'} className="absolute inset-0 w-full h-full object-cover" style={clipStyles.topLeft}/>
			<img src={images[1].src} alt={images[1].alt || 'Top-right'} className="absolute inset-0 w-full h-full object-cover" style={clipStyles.topRight}/>
			<img src={images[2].src} alt={images[2].alt || 'Bottom-left'} className="absolute inset-0 w-full h-full object-cover" style={clipStyles.bottomLeft}/>
			<img src={images[3].src} alt={images[3].alt || 'Bottom-right'} className="absolute inset-0 w-full h-full object-cover" style={clipStyles.bottomRight}/>

			<div className="absolute inset-y-0 w-0.5 bg-white/90 pointer-events-none" style={{left: `${position.x}%`}}/>
			<div className="absolute inset-x-0 h-0.5 bg-white/90 pointer-events-none" style={{top: `${position.y}%`}}/>
			<div
				className="absolute w-4 h-4 rounded-full border-2 border-white bg-black/40 pointer-events-none"
				style={{left: `calc(${position.x}% - 8px)`, top: `calc(${position.y}% - 8px)`}}
			/>
			<div className="absolute inset-0 z-20 pointer-events-none">
				{labelTag(splitLabel(images[0].alt), 'top-2 left-2')}
				{labelTag(splitLabel(images[1].alt), 'top-2 right-2')}
				{labelTag(splitLabel(images[2].alt), 'bottom-2 left-2')}
				{labelTag(splitLabel(images[3].alt), 'bottom-2 right-2')}
			</div>
		</div>
	);
};

const renderTwentyTwenty = (node: any): JSX.Element | null => {
	const children = Array.isArray(node?.children) ? node.children : [];
	const images = children
		.filter((child: any) => child?.type === 'element' && child?.tagName === 'img')
		.map((img: any) => ({
			src: typeof img?.properties?.src === 'string' ? img.properties.src : '',
			alt: typeof img?.properties?.alt === 'string' ? img.properties.alt : ''
		}))
		.filter((image: {src: string; alt: string}) => Boolean(image.src));

	if (images.length < 2) {
		return null;
	}

	if (images.length === 4) {
		return <FourWayCompare images={[images[0], images[1], images[2], images[3]]}/>;
	}

	if (images.length === 2) {
		return <TwoWayCompare left={images[0]} right={images[1]}/>;
	}

	if (images.length === 3) {
		return <ThreeWayCompare images={[images[0], images[1], images[2]]}/>;
	}

	const pairs: Array<[CompareImage, CompareImage]> = [];
	for (let index = 0; index + 1 < images.length; index += 2) {
		pairs.push([images[index], images[index + 1]]);
	}

	return (
		<div className="space-y-4">
			{pairs.map(([left, right], index) => (
				<TwoWayCompare key={`${left.src}-${right.src}-${index}`} left={left} right={right}/>
			))}
		</div>
	);
};

const headingWithBackToToc = (Tag: 'h1' | 'h2' | 'h3') => {
	return ({id, className, children}: {id?: string; className?: string; children?: ReactNode}) => (
		<Tag id={id} className={`${className ?? ''} scroll-mt-24`.trim()}>
			{children}
			{' '}
			<a
				href="#table-of-contents"
				className="ml-2 no-underline !border-0 !bg-transparent hover:!bg-transparent dark:hover:!bg-transparent">
				↑
			</a>
		</Tag>
	);
};

const headingWithoutArrow = (Tag: 'h4' | 'h5' | 'h6') => {
	return ({id, className, children}: {id?: string; className?: string; children?: ReactNode}) => (
		<Tag id={id} className={`${className ?? ''} scroll-mt-24`.trim()}>
			{children}
		</Tag>
	);
};

const markdownComponents = {
	h1: headingWithBackToToc('h1'),
	h2: headingWithBackToToc('h2'),
	h3: headingWithBackToToc('h3'),
	h4: headingWithoutArrow('h4'),
	h5: headingWithoutArrow('h5'),
	h6: headingWithoutArrow('h6'),
	pre: ({children}: {children?: ReactNode}) => <pre className="bg-gray-100 text-gray-900 rounded p-4 overflow-x-auto">{children}</pre>,
	code: ({children, className}: {children?: ReactNode; className?: string}) => <code className={`font-mono text-[0.95em] ${className ?? ''}`.trim()}>{children}</code>,
	img: ({src, alt}: {src?: string; alt?: string}) => <img src={src ?? ''} alt={alt ?? ''} className="w-full h-auto rounded"/>,
	div: ({node, className, children}: {node?: any; className?: string; children?: ReactNode}) => {
		const nodeClassName = getNodeClassName(node);
		if (nodeClassName.includes('twentytwenty-container')) {
			return renderTwentyTwenty(node) ?? <div className={className}>{children}</div>;
		}

		if (nodeClassName.includes('row')) {
			return <div className="not-prose flex flex-nowrap gap-2 mb-5 overflow-x-auto">{children}</div>;
		}

		if (nodeClassName.includes('col-xs-3') || nodeClassName.includes('col-xs-6')) {
			return <div className="flex-1 min-w-0 p-1">{children}</div>;
		}

		return <div className={className}>{children}</div>;
	}
};

const Nori: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({introMarkdown, bodyMarkdown, toc}) => (
	<div id="nori-content" className="w-full min-w-0 px-2 py-6">
		<style jsx global>{`
			#nori-content .katex-display {
				overflow-x: auto;
				overflow-y: hidden;
				max-width: 100%;
				padding-bottom: 0.25rem;
			}

			#nori-content .katex-display > .katex {
				white-space: nowrap;
			}
		`}</style>
		<div suppressHydrationWarning className="prose max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h4:font-semibold prose-a:border-b prose-a:border-gray-600 prose-a:transition prose-a:rounded-t-sm prose-a:hover:bg-amber-200 dark:prose-a:hover:bg-gray-600">
			<ReactMarkdown
				remarkPlugins={markdownPlugins}
				rehypePlugins={rehypePlugins}
				components={markdownComponents}>
				{introMarkdown}
			</ReactMarkdown>
		</div>

		<section id="table-of-contents" className="mt-8 mb-10">
			<h2 className="text-2xl font-bold mb-4">Table of Contents</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				{toc.map(section => (
					<div key={section.id} className="rounded p-3">
						<a href={`#${section.id}`} className="font-semibold hover:underline block mb-2 border-b border-gray-600 transition hover:bg-amber-200 dark:hover:bg-gray-600 rounded-t-sm w-fit">
							{section.title}
						</a>
						<div className="space-y-1">
							{section.features.map(feature => (
								<a key={feature.id} href={`#${feature.id}`} className="block text-sm hover:underline border-b border-gray-600 transition hover:bg-amber-200 dark:hover:bg-gray-600 rounded-t-sm w-fit">
									{feature.title}
								</a>
							))}
						</div>
					</div>
				))}
			</div>
		</section>

		<div suppressHydrationWarning className="prose max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h4:font-semibold prose-a:border-b prose-a:border-gray-600 prose-a:transition prose-a:rounded-t-sm prose-a:hover:bg-amber-200 dark:prose-a:hover:bg-gray-600">
			<ReactMarkdown
				remarkPlugins={markdownPlugins}
				rehypePlugins={rehypePlugins}
				components={markdownComponents}>
				{bodyMarkdown}
			</ReactMarkdown>
		</div>
	</div>
);

export default Nori;
