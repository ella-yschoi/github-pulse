import argparse
import os
import sys
from pathlib import Path


def validate_artifacts(artifacts_dir: Path) -> None:
    if not artifacts_dir.exists():
        print(f"[ERROR] Artifacts directory not found: {artifacts_dir}")
        sys.exit(1)

    expected = ["web-build", "backend-build"]
    missing = [name for name in expected if not (artifacts_dir / name).exists()]
    if missing:
        print(f"[ERROR] Missing artifacts: {', '.join(missing)}")
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Deploy script")
    parser.add_argument("--artifacts", required=True, help="Path to downloaded artifacts")
    parser.add_argument("--env", default=os.getenv("DEPLOY_ENV", "staging"), help="Target environment")
    args = parser.parse_args()

    artifacts_dir = Path(args.artifacts)
    validate_artifacts(artifacts_dir)

    deploy_target = os.getenv("DEPLOY_TARGET")
    environment = args.env

    print("[INFO] Deployment dry-run summary")
    print(f" - Environment: {environment}")
    print(f" - Deploy target: {deploy_target or '(not set, dry-run only)'}")
    print(f" - Artifacts root: {artifacts_dir}")
    for name in sorted(p.name for p in artifacts_dir.iterdir() if p.is_dir()):
        path = artifacts_dir / name
        total_files = sum(1 for _ in path.rglob('*') if _.is_file())
        size_bytes = sum(_.stat().st_size for _ in path.rglob('*') if _.is_file())
        print(f"   * {name}: {total_files} files, {size_bytes} bytes")

    if not deploy_target:
        print("[INFO] No DEPLOY_TARGET provided. Exiting without deploying (resume-ready).")
        return

    print("[INFO] DEPLOY_TARGET is set, but deploy is intentionally a no-op.")
    print("[INFO] Add your provider-specific upload/restart code here when ready.")


if __name__ == "__main__":
    main()


