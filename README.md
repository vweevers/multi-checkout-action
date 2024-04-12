# multi-checkout-action

**A [GitHub Action](https://github.com/features/actions) that wraps [`actions/checkout`](https://github.com/actions/checkout) to checkout multiple additional repositories.** 

![GitHub tag](https://img.shields.io/github/v/tag/vweevers/multi-checkout-action?sort=semver)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Deprecation Notice

**This action is deprecated and will be unpublished in 2025.** I originally wrote it to use actions from private repositories. GitHub has since implemented [a built-in way](https://docs.github.com/en/actions/creating-actions/sharing-actions-and-workflows-from-your-private-repository) to share such actions, removing the need for `multi-checkout-action`.

## Usage

```yaml
- uses: actions/checkout@v2
- name: Checkout private actions
  uses: vweevers/multi-checkout-action@v1
  with:
    token: ${{ secrets.GITHUB_MACHINE_TOKEN }}
    repositories: |
      my-org/example-action
      my-org/another-action@v3.1.0
      my-org/third-action
```

Space separated lists work too. Very useful when retrieving the list with another step and chaining things.

```yaml
- uses: actions/checkout@v2
- name: Checkout private actions
  uses: vweevers/multi-checkout-action@v1
  with:
    token: ${{ secrets.GITHUB_MACHINE_TOKEN }}
    repositories: my-org/example-action my-org/another-action@v3.1.0 my-org/third-action
```

The private actions can then be used like so:

```yaml
- name: Example
  uses: ../my-org/example-action
```

The token must have read access to the repositories. In the case of private repositories you'll want to create a [machine user](https://docs.github.com/en/developers/overview/managing-deploy-keys#machine-users), add the machine user to the repositories that you want to checkout and then generate a token for the machine user. Alternatively use [deploy keys](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys) via the [`ssh-key` input](https://github.com/actions/checkout#usage).

## Inputs

- `repositories`: newline-or-space-separated repositories in the form of `owner/name` (to checkout the default branch) or `owner/name@ref` where `ref` is a branch name, tag or SHA to checkout.
- `path`: relative path under `$GITHUB_WORKSPACE` to place the repositories. Default is `..` so that repositories are cloned to `../owner/name`.

Other inputs are forwarded to [`actions/checkout`](https://github.com/actions/checkout) (excluding `repository`, `ref` and `persist-credentials` which is always `false`).

## License

[MIT](LICENSE)
