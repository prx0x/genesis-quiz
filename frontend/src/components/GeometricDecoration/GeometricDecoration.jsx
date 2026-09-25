import './GeometricDecoration.css';

export default function GeometricDecoration({ variant = 'hero' }) {
  return (
    <div className={`geo-deco geo-deco-${variant}`} aria-hidden="true">
      <span className="shape circle blue" />
      <span className="shape square red" />
      <span className="shape rect yellow" />
      <span className="shape line-h" />
      <span className="shape line-v" />
      <span className="shape circle-sm black" />
      <span className="shape square-sm blue" />
    </div>
  );
}
